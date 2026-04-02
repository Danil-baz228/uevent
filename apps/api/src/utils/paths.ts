import { join } from 'path';

export const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
export const API_ROOT = join(REPO_ROOT, 'apps', 'api');
export const WEB_DIST_ROOT = join(REPO_ROOT, 'apps', 'web', 'dist');
export const WEB_INDEX_PATH = join(WEB_DIST_ROOT, 'index.html');
export const UPLOADS_ROOT = join(API_ROOT, 'uploads');
