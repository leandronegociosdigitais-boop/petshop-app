export function isWeeklyBackupDue(lastBackup, now = new Date()) {
  const saturday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  saturday.setDate(saturday.getDate() - ((saturday.getDay() + 1) % 7))
  const previous = new Date(lastBackup)
  return !lastBackup || !Number.isFinite(previous.getTime()) || previous < saturday
}
