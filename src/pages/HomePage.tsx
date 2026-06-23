import Navigation from '../sections/Navigation'
import HeroSection from '../sections/HeroSection'
import FeatureInfoProcessing from '../sections/FeatureInfoProcessing'
import VisualTest3D from '../sections/VisualTest3D'
import AttentionSection from '../sections/AttentionSection'
import CoordinationSection from '../sections/CoordinationSection'
import DataExportSection from '../sections/DataExportSection'
import Footer from '../sections/Footer'

export default function HomePage() {
  return (
    <div className="relative">
      <Navigation />
      <HeroSection />
      <FeatureInfoProcessing />
      <VisualTest3D />
      <AttentionSection />
      <CoordinationSection />
      <DataExportSection />
      <Footer />
    </div>
  )
}
