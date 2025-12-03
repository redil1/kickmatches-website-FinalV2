import { Queue, JobsOptions } from 'bullmq'

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
}

export type PushBroadcastJob = { title: string; body: string; url?: string }

export const queues = {
  create: new Queue<Record<string, any>>('pmm-create', { connection }),
  alert: new Queue<Record<string, any>>('pmm-alert', { connection }),
  live: new Queue<Record<string, any>>('pmm-live', { connection }),
  trial: new Queue<Record<string, any>>('trial-provision', { connection }),
  push: new Queue<PushBroadcastJob>('push-broadcast', { connection }),
}

export async function scheduleTrialFlow(phone: string) {
  const opts: JobsOptions = { removeOnComplete: true, removeOnFail: true }
  await queues.trial.add('nudge', { phone }, { ...opts, delay: 30 * 60 * 1000 })
  await queues.trial.add('expire', { phone }, { ...opts, delay: 12 * 60 * 60 * 1000 })
}

export async function enqueuePushBroadcast(job: PushBroadcastJob) {
  await queues.push.add('broadcast', job, { removeOnComplete: true, removeOnFail: true })
}


