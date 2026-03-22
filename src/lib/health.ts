import AppleHealthKit, {
  HealthKitPermissions,
  HealthInputOptions,
} from 'react-native-health'

const permissions: HealthKitPermissions = {
  permissions: {
    read: [AppleHealthKit.Constants.Permissions.StepCount],
    write: [],
  },
}

export function initHealthKit(): Promise<void> {
  return new Promise((resolve, reject) => {
    AppleHealthKit.initHealthKit(permissions, (err) => {
      if (err) return reject(new Error(err))
      resolve()
    })
  })
}

export function getTodaySteps(): Promise<number> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const options: HealthInputOptions = {
    startDate: startOfDay.toISOString(),
    endDate: new Date().toISOString(),
  }

  return new Promise((resolve, reject) => {
    AppleHealthKit.getStepCount(options, (err, result) => {
      if (err) return reject(new Error(err))
      resolve(result.value ?? 0)
    })
  })
}
