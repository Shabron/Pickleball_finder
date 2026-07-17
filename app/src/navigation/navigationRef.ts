/**
 * navigationRef — Global ref so non-component code (push notification
 * tap handlers, etc.) can navigate without going through React context.
 */
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();
