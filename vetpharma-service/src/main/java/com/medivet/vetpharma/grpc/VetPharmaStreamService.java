package com.medivet.vetpharma.grpc;

import com.medivet.vetpharma.entity.Stock;
import com.medivet.vetpharma.grpc.generated.*;
import com.medivet.vetpharma.service.StockService;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

/**
 * RPC <b>streaming serveur</b> : {@code SuivreStocks}.
 *
 * <p>Envoie en une seule rafale l'état courant de tous les stocks
 * de la pharmacie demandée (ou de toutes si {@code pharmacieId == 0}),
 * puis ferme le flux.
 *
 * <p>Pour un vrai flux temps-réel il faudrait un mécanisme push
 * (ex. Redis Pub/Sub ou Spring Events) ; cette implémentation illustre
 * le streaming serveur gRPC tel que requis par l'architecture.
 */
@GrpcService
public class VetPharmaStreamService extends VetPharmaServiceGrpc.VetPharmaServiceImplBase {

    private static final Logger log = LoggerFactory.getLogger(VetPharmaStreamService.class);

    private final StockService stockService;

    public VetPharmaStreamService(StockService stockService) {
        this.stockService = stockService;
    }

    @Override
    public void suivreStocks(SuivreStocksRequest req,
                             StreamObserver<StockResponse> obs) {
        try {
            List<Stock> stocks = req.getPharmacieId() == 0
                    ? stockService.listerTous()
                    : stockService.listerParPharmacie(req.getPharmacieId());

            for (Stock s : stocks) {
                obs.onNext(StockResponse.newBuilder()
                        .setStockId(s.getStockId())
                        .setProduitId(s.getProduit().getProduitId())
                        .setPharmacieId(s.getPharmacie().getPharmacieId())
                        .setQuantiteDispo(s.getQuantiteDispo())
                        .setStatut(s.getStatut().name())
                        .build());
            }
            obs.onCompleted();
            log.debug("suivreStocks : {} stock(s) envoyé(s) pour pharmacieId={}",
                      stocks.size(), req.getPharmacieId());
        } catch (Exception e) {
            log.error("suivreStocks error", e);
            obs.onError(io.grpc.Status.INTERNAL
                    .withDescription("Erreur streaming stocks : " + e.getMessage())
                    .asRuntimeException());
        }
    }
}
