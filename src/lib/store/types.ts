import { DataSlice } from './slices/createDataSlice';
import { SettingsSlice } from './slices/createSettingsSlice';
import { UISlice } from './slices/createUISlice';
import { SyncSlice } from './slices/createSyncSlice';
import { AnalyticsSlice } from './slices/createAnalyticsSlice';

export type StoreState = DataSlice & SettingsSlice & UISlice & SyncSlice & AnalyticsSlice;
