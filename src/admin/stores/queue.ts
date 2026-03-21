import { defineStore } from 'pinia'
import { OperationQueue } from '../queue'
import { startDeployPolling } from '../github'
import { toastSuccess, toastError, toastProgress } from '../../components/toast'
import { useRecipeStore } from './recipe'
import { useBlogStore } from './blog'

export const useQueueStore = defineStore('queue', () => {
  const operationQueue = new OperationQueue()
  let stopCurrentPolling: (() => void) | null = null
  let toastsInitialized = false

  function reloadAll() {
    useRecipeStore().loadData()
    useBlogStore().loadData()
  }

  function setupToasts() {
    if (toastsInitialized) return
    toastsInitialized = true

    let errorHandled = false

    operationQueue.setStatusCallback((status) => {
      if (status.total === 0 && !status.error) return

      if (status.error) {
        toastError(`Fout: ${status.error}`, 'queue', [
          { label: 'Opnieuw', onClick: () => operationQueue.retry() },
          { label: 'Annuleren', onClick: () => { operationQueue.clear(); reloadAll() } },
        ])
        if (!errorHandled) {
          errorHandled = true
          reloadAll()
        }
      } else if (status.completed === status.total && status.total > 0) {
        toastSuccess('Alle acties verwerkt!', 'queue')
      } else {
        errorHandled = false
        toastProgress(`Verwerken: ${status.completed + 1} van ${status.total} — ${status.current}`, 'queue')
      }
    })
  }

  function pollDeploy() {
    if (stopCurrentPolling) stopCurrentPolling()

    toastProgress('Website wordt bijgewerkt...', 'deploy')

    stopCurrentPolling = startDeployPolling((status) => {
      switch (status) {
        case 'queued':
          toastProgress('Website wordt bijgewerkt — in de wachtrij...', 'deploy')
          break
        case 'in_progress':
          toastProgress('Website wordt bijgewerkt — publiceren...', 'deploy')
          break
        case 'completed':
          stopCurrentPolling = null
          toastSuccess('Website is live!', 'deploy')
          break
        case 'failed':
          stopCurrentPolling = null
          toastError('Publicatie mislukt', 'deploy')
          break
      }
    })
  }

  return { operationQueue, setupToasts, pollDeploy }
})
