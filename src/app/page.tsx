"use client";

import { useState } from 'react';
import Modal from './components/Modal';
import { SpeedInsights } from "@vercel/speed-insights/next"
// import Image from "next/image";

const Home = () => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [caseActions, setCaseActions] = useState<boolean>(false);
  const [adminActions, setAdminActions] = useState<boolean>(false);
  const [reportsData, setReportsData] = useState<boolean>(false);
  const [adminAction, setAdminAction] = useState<string>('');

  const handleModalOpen = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleModal = (name: string):void => {
    setShowModal(false);
    setAdminAction(name);
  };

  const setActions = (data: string) => {
    if (data === 'case') { setCaseActions(!caseActions); setAdminActions(false); setReportsData(false); };
    if (data === 'admin') { setCaseActions(false); setAdminActions(true); setReportsData(false); };
    if (data === 'reports') { setCaseActions(false); setAdminActions(false); setReportsData(!reportsData); };
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] m-6 border-double border-4 justify-items-center min-h-screen p-8">
      <main className="flex flex-row flex-wrap w-full">
        <div className="flex flex-wrap justify-center w-full">
          <div className="flex w-full justify-center mb-6">
            <span className='text-2xl font-bold'>ICS MAIN MENU</span>
          </div>
          <div className="flex items-stretch w-full">
            <div className="flex justify-center w-full">
              <a href="/#" onClick={() => setActions('case')}>
                <button className="text-lg font-[family-name:var(--font-geist-mono)] text-white-500 hover:underline" type="button">CASE ACTIONS</button>
              </a>
            </div>
            <div className="flex justify-center w-full">
              <a href="/#" onClick={(e) => [handleModalOpen(e), setActions('admin')]}>
                <button className="text-lg font-[family-name:var(--font-geist-mono)] text-white-500 hover:underline" type="button">ADMIN ACTIONS</button>
              </a>
            </div>
            <div className="flex justify-center w-full">
              <a href="/#" onClick={() => setActions('reports')}>
                <button className="text-lg font-[family-name:var(--font-geist-mono)] text-white-500 hover:underline" type="button">REPORTS</button>
              </a>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-center mt-10 h-96 w-full">
          <div className="flex justify-center items-center">
            {caseActions ? (
              <span>No Archive Data Exists For This CASE ACTIONS</span>
            ) : adminActions ? (
                <span>No Archive Data Exists For {adminAction ? adminAction : 'ADMIN ACTIONS'}</span>
            ) : reportsData ? (
              <span>No Archive Data Exists For REPORTS</span>
            ) : ('')}
          </div>
        </div>
      </main>
      <Modal show={showModal} onClose={handleModal} />
      <SpeedInsights />
    </div>
  );
};

export default Home;