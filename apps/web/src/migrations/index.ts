import * as migration_20261012_163319_initial from './20261012_163319_initial';
import * as migration_20261018_071753_super_admin from './20261018_071753_super_admin';

export const migrations = [
  {
    up: migration_20261012_163319_initial.up,
    down: migration_20261012_163319_initial.down,
    name: '20261012_163319_initial',
  },
  {
    up: migration_20261018_071753_super_admin.up,
    down: migration_20261018_071753_super_admin.down,
    name: '20261018_071753_super_admin'
  },
];
