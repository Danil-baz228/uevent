import 'dotenv/config';

import { DataSource } from 'typeorm';

import { EventCommentEntity } from '../modules/comments/entities/event-comment.entity';
import { CompanyEntity } from '../modules/companies/entities/company.entity';
import { CompanyNewsEntity } from '../modules/companies/entities/company-news.entity';
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
import { AddEventFormatAndTheme1760000000007 } from './migrations/1760000000007-AddEventFormatAndTheme';
import { AddAttendeeVisibility1760000000008 } from './migrations/1760000000008-AddAttendeeVisibility';
import { AddEventPublishAt1760000000009 } from './migrations/1760000000009-AddEventPublishAt';
import { AddEventCommentAccessAndAttendeeNotifications1760000000010 } from './migrations/1760000000010-AddEventCommentAccessAndAttendeeNotifications';
import { AddRegistrationReminderFields1760000000011 } from './migrations/1760000000011-AddRegistrationReminderFields';
import { AddCompanies1760000000012 } from './migrations/1760000000012-AddCompanies';
import { AddCompanyNews1760000000013 } from './migrations/1760000000013-AddCompanyNews';
import { AddEventAddress1760000000014 } from './migrations/1760000000014-AddEventAddress';
import { AddEventPromoCodes1760000000015 } from './migrations/1760000000015-AddEventPromoCodes';
import { AddEventRedirectAfterPurchase1760000000016 } from './migrations/1760000000016-AddEventRedirectAfterPurchase';
import { AddCompanySubscriptions1760000000017 } from './migrations/1760000000017-AddCompanySubscriptions';
import { AddRegistrationNameVisibility1760000000018 } from './migrations/1760000000018-AddRegistrationNameVisibility';
import { AddPaymentReceiptArtifacts1760000000019 } from './migrations/1760000000019-AddPaymentReceiptArtifacts';
import { AddRegistrationCheckInFields1760000000020 } from './migrations/1760000000020-AddRegistrationCheckInFields';
import { AddCommentsClosedByAdmin1760000000021 } from './migrations/1760000000021-AddCommentsClosedByAdmin';
import { AddUserIsAdmin1760000000022 } from './migrations/1760000000022-AddUserIsAdmin';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'postgres',
  database: process.env.DATABASE_NAME ?? 'uevent',
  entities: [
    UserEntity,
    CompanyEntity,
    CompanyNewsEntity,
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
    AddEventFormatAndTheme1760000000007,
    AddAttendeeVisibility1760000000008,
    AddEventPublishAt1760000000009,
    AddEventCommentAccessAndAttendeeNotifications1760000000010,
    AddRegistrationReminderFields1760000000011,
    AddCompanies1760000000012,
    AddCompanyNews1760000000013,
    AddEventAddress1760000000014,
    AddEventPromoCodes1760000000015,
    AddEventRedirectAfterPurchase1760000000016,
    AddCompanySubscriptions1760000000017,
    AddRegistrationNameVisibility1760000000018,
    AddPaymentReceiptArtifacts1760000000019,
    AddRegistrationCheckInFields1760000000020,
    AddCommentsClosedByAdmin1760000000021,
    AddUserIsAdmin1760000000022,
  ],
  synchronize: false,
});

export default dataSource;
