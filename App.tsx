import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { AuroraBackground } from './components/AuroraBackground';
import { StudentView } from './components/StudentView';
import { TeacherDashboard } from './components/TeacherDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { ControlPanel } from './components/ControlPanel';
import { AboutPage } from './components/AboutPage';
import { ToastProvider } from './components/ToastProvider';
import { JudgeGuide } from './components/guide/JudgeGuide';


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('student');
  const [globalColor, setGlobalColor] = useState<string | undefined>(undefined);

  return (
    <ToastProvider>
      <AuroraBackground targetColor={globalColor}>
        <Layout activeTab={activeTab} onTabChange={setActiveTab}>
          <div className="animate-in fade-in zoom-in-95 duration-700 ease-out">
            {activeTab === 'student' && <StudentView onColorChange={setGlobalColor} />}
            {activeTab === 'teacher' && <TeacherDashboard />}
            {activeTab === 'admin' && <AdminDashboard />}
            {activeTab === 'demo' && <ControlPanel />}
            {activeTab === 'specs' && <AboutPage />}
          </div>
          <JudgeGuide currentView={activeTab} onNavigate={(v: any) => setActiveTab(v)} />
        </Layout>
      </AuroraBackground>
    </ToastProvider>
  );
};

export default App;