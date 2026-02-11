import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/core/ui/button'
import { ToastAction } from '@/core/ui/toast'
import { useToast } from '@/core/ui/use-toast'
import { useEffect } from 'react'

export function ReloadPrompt() {
    const { toast } = useToast()

    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r)
        },
        onRegisterError(error) {
            console.log('SW registration error', error)
        },
    })

    useEffect(() => {
        if (needRefresh) {
            toast({
                title: "New content available",
                description: "Click on reload button to update.",
                action: (
                    <ToastAction altText="Reload" onClick={() => updateServiceWorker(true)}>
                        Reload
                    </ToastAction>
                ),
                duration: Infinity,
            })
        }
    }, [needRefresh, updateServiceWorker, toast])

    return null
}
