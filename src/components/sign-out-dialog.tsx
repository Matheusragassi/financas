import { toast } from "sonner"
import { Download, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useStore } from "@/lib/store"
import { signOut, useSync } from "@/lib/sync"
import { downloadJson } from "@/lib/backup"

/** Sair: com Google os dados ficam salvos; sem Google, oferece backup antes de apagar o aparelho */
export function SignOutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const user = useSync((s) => s.user)
  const dirty = useSync((s) => s.dirty)
  const { isDemo, expenses, resetAll, exportBackup } = useStore()

  const leave = () => {
    if (user) signOut(true)
    else resetAll()
    window.location.hash = ""
    onOpenChange(false)
    toast(isDemo ? "Você saiu da demonstração" : "Você saiu", user && !isDemo ? { description: "Seus dados continuam salvos no seu Google." } : undefined)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isDemo ? "Sair da demonstração?" : "Sair da conta?"}</DialogTitle>
          <DialogDescription>
            {isDemo
              ? "Os dados fictícios serão apagados e você volta para a tela inicial."
              : user
                ? dirty
                  ? "Há alterações que ainda não chegaram ao Google. Aguarde a sincronização ou saia mesmo assim (elas serão perdidas)."
                  : `Seus dados estão salvos no Google (${user.email}). Para vê-los de novo, é só entrar com a mesma conta.`
                : `Você não está conectado ao Google: os ${expenses.length} lançamentos existem só neste aparelho e serão apagados. Baixe um backup antes, se quiser guardá-los.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {!user && !isDemo && expenses.length > 0 && (
            <Button variant="outline" onClick={() => { downloadJson(exportBackup(), `financas-backup-${new Date().toISOString().slice(0, 10)}.json`); leave() }}>
              <Download /> Baixar backup e sair
            </Button>
          )}
          <Button variant={!user && !isDemo ? "destructive" : "default"} onClick={leave}><LogOut /> Sair</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
