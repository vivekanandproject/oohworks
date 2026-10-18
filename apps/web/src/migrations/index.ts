import * as migration_20261012_163319_initial from './20261012_163319_initial';
import * as migration_20261018_071753_super_admin from './20261018_071753_super_admin';
import * as migration_20261018_165806_listing_reports from './20261018_165806_listing_reports';
import * as migration_20261018_171931_site_changes from './20261018_171931_site_changes';
import * as migration_20261018_173440_follow_alerts from './20261018_173440_follow_alerts';
import * as migration_20261018_175731_kit_reading from './20261018_175731_kit_reading';

export const migrations = [
  {
    up: migration_20261012_163319_initial.up,
    down: migration_20261012_163319_initial.down,
    name: '20261012_163319_initial',
  },
  {
    up: migration_20261018_071753_super_admin.up,
    down: migration_20261018_071753_super_admin.down,
    name: '20261018_071753_super_admin',
  },
  {
    up: migration_20261018_165806_listing_reports.up,
    down: migration_20261018_165806_listing_reports.down,
    name: '20261018_165806_listing_reports',
  },
  {
    up: migration_20261018_171931_site_changes.up,
    down: migration_20261018_171931_site_changes.down,
    name: '20261018_171931_site_changes',
  },
  {
    up: migration_20261018_173440_follow_alerts.up,
    down: migration_20261018_173440_follow_alerts.down,
    name: '20261018_173440_follow_alerts',
  },
  {
    up: migration_20261018_175731_kit_reading.up,
    down: migration_20261018_175731_kit_reading.down,
    name: '20261018_175731_kit_reading'
  },
];
