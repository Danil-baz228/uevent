import 'dotenv/config';

import { DataSource } from 'typeorm';

import { EventCommentEntity } from '../modules/comments/entities/event-comment.entity';
import { EventEntity } from '../modules/events/entities/event.entity';
import { NotificationEntity } from '../modules/notifications/entities/notification.entity';
import { EventRegistrationEntity } from '../modules/registrations/entities/event-registration.entity';
import { UserEntity } from '../modules/users/entities/user.entity';
import { InitialSchema1760000000000 } from './migrations/1760000000000-InitialSchema';
import { AddRefreshTokenHashToUsers1760000000001 } from './migrations/1760000000001-AddRefreshTokenHashToUsers';
import { AddEventComments1760000000002 } from './migrations/1760000000002-AddEventComments';
import { AddCommentReplies1760000000003 } from './migrations/1760000000003-AddCommentReplies';
import { AddPosterUrlToEvents1760000000004 } from './migrations/1760000000004-AddPosterUrlToEvents';
import { AddEventSettings1760000000005 } from './migrations/1760000000005-AddEventSettings';
import { AddNotifications1760000000006 } from './migrations/1760000000006-AddNotifications';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'postgres',
  database: process.env.DATABASE_NAME ?? 'uevent',
  entities: [
    UserEntity,
    EventEntity,
    EventRegistrationEntity,
    EventCommentEntity,
    NotificationEntity,
  ],
  migrations: [
    InitialSchema1760000000000,
    AddRefreshTokenHashToUsers1760000000001,
    AddEventComments1760000000002,
    AddCommentReplies1760000000003,
    AddPosterUrlToEvents1760000000004,
    AddEventSettings1760000000005,
    AddNotifications1760000000006,
  ],
  synchronize: false,
});

export default dataSource;
