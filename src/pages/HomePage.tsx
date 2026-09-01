import Navigation from '../sections/Navigation'
import HeroSection from '../sections/HeroSection'
import FeatureInfoProcessing from '../sections/FeatureInfoProcessing'
import VisualTest3D from '../sections/VisualTest3D'
import AttentionSection from '../sections/AttentionSection'
import CoordinationSection from '../sections/CoordinationSection'
import DataExportSection from '../sections/DataExportSection'
import Footer from '../sections/Footer'
import { MODULE_KEYS, type ModuleKey } from '../lib/modules'

export default function HomePage({
  visibleModules = MODULE_KEYS,
  isAdmin = false,
  userLabel,
  userName,
  onLogout,
  onDataExport,
}: {
  visibleModules?: readonly ModuleKey[]
  isAdmin?: boolean
  userLabel?: string
  userName?: string
  onLogout?: () => void
  onDataExport?: () => void
}) {
  const visible = new Set(visibleModules)
  return (
    <div className="relative">
      <Navigation visibleModules={visibleModules} isAdmin={isAdmin} userLabel={userLabel} userName={userName} onLogout={onLogout} />
      <HeroSection />
      {visible.has('information-processing') && <FeatureInfoProcessing />}
      {visible.has('sensory-proprioception') && <VisualTest3D />}
      {visible.has('attention-allocation') && <AttentionSection />}
      {(visible.has('motor-coordination') || visible.has('feedback-motor-learning')) && (
        <CoordinationSection
          showMotor={visible.has('motor-coordination')}
          showFeedback={visible.has('feedback-motor-learning')}
        />
      )}
      {visible.has('data-center') && <DataExportSection onExport={onDataExport} />}
      <Footer />
    </div>
  )
}
