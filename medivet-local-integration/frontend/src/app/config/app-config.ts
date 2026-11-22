/**
 * ⚠️  TEMPORARY DEVELOPMENT CONFIGURATION — NOT FOR PRODUCTION ⚠️
 *
 * These identifiers are hardcoded as a temporary measure while US01
 * (user registration and login) is not yet integrated.
 *
 * TODO (US01): Replace APP_CONFIG.currentUserId with
 *              AuthService.getCurrentUserId()  once the authentication
 *              module developed by Engineer 1 is available.
 *
 * TODO (US01): Replace APP_CONFIG.currentVetId with
 *              AuthService.getCurrentVetId()   once the authentication
 *              module developed by Engineer 1 is available.
 *
 * When US01 is integrated:
 *  1. Inject AuthService in VetBookingComponent  → use getCurrentUserId()
 *  2. Inject AuthService in VetDashboardComponent → use getCurrentVetId()
 *  3. Delete or empty this file.
 *
 * This file must NEVER be committed with real credentials.
 */
export const APP_CONFIG = {

  /**
   * ID of the currently logged-in owner (Pet Owner role).
   * Used in VetBookingComponent to populate AppointmentRequest.ownerId.
   *
   * TODO (US01): replace with AuthService.getCurrentUserId()
   */
  currentUserId: 1,

  /**
   * ID of the currently logged-in veterinarian.
   * Used in VetDashboardComponent to load and manage the vet's slots.
   *
   * TODO (US01): replace with AuthService.getCurrentVetId()
   */
  currentVetId: 1,
} as const;
