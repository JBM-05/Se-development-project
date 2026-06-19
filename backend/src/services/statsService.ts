import { query } from "../db/pool";

export async function getStats(): Promise<{
  totalRequests: number;
  approved: number;
  underReview: number;
  noReply: number;
  byState: Array<{ state: string; count: number }>;
  byMajor: Array<{ major: string; count: number }>;
  byCity: Array<{ city: string; count: number }>;
}> {
  const totals = await query<{ total: string; approved: string; under_review: string; no_reply: string }>(
    `select
       count(*)::text as total,
       count(*) filter (where s.slug = 'approved')::text as approved,
       count(*) filter (where s.slug = 'under_review')::text as under_review,
       count(*) filter (where s.slug = 'no_reply')::text as no_reply
     from registration_requests r
     join request_states s on s.id = r.state_id
     where r.archived_at is null`
  );

  const byState = await query<{ state: string; count: string }>(
    `select s.slug as state, count(*)::text as count
     from registration_requests r
     join request_states s on s.id = r.state_id
     where r.archived_at is null
     group by s.slug, s.sort_order
     order by s.sort_order asc`
  );

  const byMajor = await query<{ major: string; count: string }>(
    `select major, count(*)::text as count
     from registration_requests
     where archived_at is null
     group by major
     order by count(*) desc, major asc`
  );

  const byCity = await query<{ city: string; count: string }>(
    `select city, count(*)::text as count
     from registration_requests
     where archived_at is null
     group by city
     order by count(*) desc, city asc`
  );

  const row = totals.rows[0];
  return {
    totalRequests: Number(row.total),
    approved: Number(row.approved),
    underReview: Number(row.under_review),
    noReply: Number(row.no_reply),
    byState: byState.rows.map((item) => ({ state: item.state, count: Number(item.count) })),
    byMajor: byMajor.rows.map((item) => ({ major: item.major, count: Number(item.count) })),
    byCity: byCity.rows.map((item) => ({ city: item.city, count: Number(item.count) }))
  };
}

