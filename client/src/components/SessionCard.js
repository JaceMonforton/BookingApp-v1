import React from 'react';
import { Card, Tag, Typography, Progress, Space } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

const TYPE_LABELS = {
  mat_pilates: 'Mat Pilates',
  reformer: 'Reformer',
  personal_training: 'Personal Training',
};

const TYPE_ACCENTS = {
  mat_pilates: 'session-card-shell--mat',
  reformer: 'session-card-shell--reformer',
  personal_training: 'session-card-shell--pt',
};

export function sessionTypeLabel(type) {
  return TYPE_LABELS[type] || type?.replace(/_/g, ' ') || 'Session';
}

/**
 * Rich session surface for schedule, trainer hub, and booking lists.
 * @param {object} props
 * @param {object} props.session – API session (or embedded booking.session)
 * @param {React.ReactNode} [props.footer] – actions row
 * @param {React.ReactNode} [props.headerExtra] – top-right (e.g. cancel)
 * @param {boolean} [props.showCapacityBar]
 * @param {string} [props.bookingStatus] – confirmed | waitlisted etc.
 * @param {React.ReactNode} [props.timeExtra] – e.g. relative countdown
 */
export default function SessionCard({
  session,
  footer,
  headerExtra,
  showCapacityBar,
  bookingStatus,
  timeExtra,
}) {
  if (!session) return null;

  const start = dayjs(session.startTime);
  const end = session.endTime ? dayjs(session.endTime) : null;
  const enrolled = session.enrolledClients?.length ?? 0;
  const cap = session.maxCapacity ?? 0;
  const pct = cap > 0 ? Math.min(100, Math.round((enrolled / cap) * 100)) : 0;
  const accent = TYPE_ACCENTS[session.type] || 'session-card-shell--default';
  const nearlyFull = cap > 0 && enrolled >= cap - 1 && enrolled < cap;
  const full = cap > 0 && enrolled >= cap;

  return (
    <Card
      className={`session-card-shell ${accent}`}
      bordered={false}
      styles={{ body: { padding: 0 } }}
    >
      <div className="session-card-shell__accent-bar" aria-hidden />

      <div className="session-card-shell__head">
        <div className="session-card-shell__type-row">
          <span className="session-card-shell__type-name">{sessionTypeLabel(session.type)}</span>
          <Space size={6} wrap className="session-card-shell__tags">
            {session.isZoom && (
              <Tag icon={<VideoCameraOutlined />} color="cyan" className="session-card-shell__tag">
                Zoom
              </Tag>
            )}
            {bookingStatus && (
              <Tag
                color={
                  bookingStatus === 'confirmed'
                    ? 'success'
                    : bookingStatus === 'waitlisted'
                      ? 'gold'
                      : 'default'
                }
                className="session-card-shell__tag"
              >
                {bookingStatus}
              </Tag>
            )}
          </Space>
        </div>
        {headerExtra ? <div className="session-card-shell__head-extra">{headerExtra}</div> : null}
      </div>

      <div className="session-card-shell__date-block">
        <div className="session-card-shell__date-icon" aria-hidden>
          <CalendarOutlined />
        </div>
        <div>
          <div className="session-card-shell__date-primary">{start.format('dddd, MMM D')}</div>
          <div className="session-card-shell__date-time">
            {start.format('h:mm a')}
            {end ? ` – ${end.format('h:mm a')}` : ''}
          </div>
          {timeExtra ? (
            <div className="session-card-shell__countdown">{timeExtra}</div>
          ) : null}
        </div>
      </div>

      <div className="session-card-shell__meta">
        <div className="session-card-shell__meta-row">
          <UserOutlined className="session-card-shell__meta-icon" />
          <Text type="secondary">
            <Text strong>{session.trainer?.name || 'Trainer'}</Text>
            {session.trainer?.email ? (
              <span className="session-card-shell__meta-sub"> · {session.trainer.email}</span>
            ) : null}
          </Text>
        </div>
        <div className="session-card-shell__meta-row">
          <TeamOutlined className="session-card-shell__meta-icon" />
          <Text type="secondary">
            <Text strong>{enrolled}</Text> / {cap} enrolled
            {full ? (
              <Tag color="red" className="session-card-shell__fill-tag">
                Full
              </Tag>
            ) : nearlyFull ? (
              <Tag color="orange" className="session-card-shell__fill-tag">
                Almost full
              </Tag>
            ) : null}
          </Text>
        </div>
      </div>

      {showCapacityBar && cap > 0 ? (
        <div className="session-card-shell__progress">
          <Progress
            percent={pct}
            showInfo={false}
            strokeColor={{
              '0%': '#0d9488',
              '100%': full ? '#dc2626' : '#14b8a6',
            }}
            trailColor="rgba(15, 23, 42, 0.06)"
            size="small"
          />
          <Text type="secondary" className="session-card-shell__progress-label">
            {pct}% capacity
          </Text>
        </div>
      ) : null}

      {footer ? <div className="session-card-shell__footer">{footer}</div> : null}
    </Card>
  );
}
