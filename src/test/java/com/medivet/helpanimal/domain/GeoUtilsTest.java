package com.medivet.helpanimal.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import org.junit.jupiter.api.Test;

class GeoUtilsTest {

    @Test
    void distanceNulleSurLeMemePoint() {
        assertThat(GeoUtils.distanceMeters(48.8566, 2.3522, 48.8566, 2.3522)).isEqualTo(0.0);
    }

    @Test
    void distanceParisLyonEnviron392Km() {
        double d = GeoUtils.distanceMeters(48.8566, 2.3522, 45.7640, 4.8357);
        assertThat(d / 1000).isCloseTo(392, within(5.0));
    }

    @Test
    void centMetresVersLeNord() {
        double lat2 = 48.8566 + 100.0 / 111_320;
        assertThat(GeoUtils.distanceMeters(48.8566, 2.3522, lat2, 2.3522)).isCloseTo(100, within(1.0));
    }

    @Test
    void leRectangleContientLeCercle() {
        GeoUtils.BoundingBox box = GeoUtils.boundingBox(48.8566, 2.3522, 1000);
        assertThat(box.contains(48.8566 + 0.008, 2.3522)).isTrue();
        assertThat(box.contains(48.8566, 2.3522 + 0.013)).isTrue();
        assertThat(box.contains(48.8566 + 0.02, 2.3522)).isFalse();
    }
}
