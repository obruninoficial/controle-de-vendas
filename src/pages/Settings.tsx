import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Upload, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { exportBackup, readBackupFile, restoreBackup } from '../services/backupService'

export function Settings() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleExport() {
    setError('')
    setMessage('')
    try {
      await exportBackup()
      setMessage('Backup exportado com sucesso.')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPendingFile(file)
    e.target.value = ''
  }

  async function handleConfirmImport() {
    if (!pendingFile) return
    setError('')
    setMessage('')
    setBusy(true)
    try {
      const backup = await readBackupFile(pendingFile)
      await restoreBackup(backup)
      setMessage('Backup restaurado com sucesso.')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
      setPendingFile(null)
    }
  }

  return (
    <div>
      <PageHeader title="Configurações" onBack={() => navigate('/')} />

      <div className="space-y-3 px-4 pt-4">
        <button
          onClick={handleExport}
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm active:scale-[0.99]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Download size={20} />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Exportar backup</p>
            <p className="text-sm text-slate-500">Salva um arquivo JSON com todos os seus dados</p>
          </div>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm active:scale-[0.99]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Upload size={20} />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Importar backup</p>
            <p className="text-sm text-slate-500">Restaura dados a partir de um backup exportado</p>
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handlePickFile}
        />

        {message && <p className="text-sm font-medium text-emerald-600">{message}</p>}
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="mt-6 flex gap-3 rounded-2xl bg-slate-50 p-4">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-slate-400" />
          <p className="text-sm text-slate-500">
            Este aplicativo funciona 100% offline. Nenhum dado sai do seu iPhone. Se o
            aplicativo for apagado, os dados armazenados localmente podem ser perdidos —
            faça backups regularmente.
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingFile}
        title="Atenção: importar este backup substituirá os dados atuais."
        description="Deseja continuar?"
        confirmLabel={busy ? 'Restaurando...' : 'Importar e substituir'}
        danger
        onConfirm={handleConfirmImport}
        onCancel={() => setPendingFile(null)}
      />
    </div>
  )
}
