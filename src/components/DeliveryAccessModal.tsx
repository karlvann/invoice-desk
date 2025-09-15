'use client';

import React, { useState, Fragment } from 'react';
import { X, Home, AlertCircle, Users, DollarSign, ChevronRight, ChevronLeft } from 'lucide-react';

interface DeliveryAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: string) => void;
}

interface StepInfo {
  id: number;
  name: string;
  icon: React.ReactNode;
  color: string;
}

export default function DeliveryAccessModal({ isOpen, onClose, onSelect }: DeliveryAccessModalProps) {
  const [step, setStep] = useState(1);
  const [hasStairs, setHasStairs] = useState<boolean | null>(null);
  const [hasLift, setHasLift] = useState<boolean | null>(null);
  const [stairsType, setStairsType] = useState<string | null>(null);
  const [flightCount, setFlightCount] = useState<string | null>(null);
  const [canHelp, setCanHelp] = useState<boolean | null>(null);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([1]));
  
  if (!isOpen) return null;

  const handleReset = () => {
    setStep(1);
    setHasStairs(null);
    setHasLift(null);
    setStairsType(null);
    setFlightCount(null);
    setCanHelp(null);
    setVisitedSteps(new Set([1]));
  };

  const goToStep = (newStep: number) => {
    setStep(newStep);
    setVisitedSteps(prev => new Set([...prev, newStep]));
  };

  const getAllSteps = () => {
    // All steps are always available for maximum flexibility
    return [
      {
        id: 1,
        name: 'Stairs?',
        icon: <Home className="w-4 h-4" />,
        color: 'bg-[#E5E5FF]',
        completed: hasStairs !== null
      },
      {
        id: 2,
        name: 'Type',
        icon: <AlertCircle className="w-4 h-4" />,
        color: 'bg-[#FFE5F5]',
        completed: stairsType !== null
      },
      {
        id: 5,
        name: 'Flights',
        icon: <AlertCircle className="w-4 h-4" />,
        color: 'bg-[#FFE5F5]',
        completed: flightCount !== null
      },
      {
        id: 3,
        name: 'Help?',
        icon: <Users className="w-4 h-4" />,
        color: 'bg-[#FFE5F5]',
        completed: canHelp !== null
      },
      {
        id: 4,
        name: 'Lift?',
        icon: <Home className="w-4 h-4" />,
        color: 'bg-[#E5E5FF]',
        completed: hasLift !== null
      }
    ];
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleComplete = () => {
    let deliveryAccess = '';
    
    if (!hasStairs) {
      if (hasLift) {
        deliveryAccess = 'Lift access';
      } else {
        deliveryAccess = 'Ground floor';
      }
    } else if (stairsType === 'few') {
      deliveryAccess = 'Few steps';
    } else if (stairsType === 'flight') {
      deliveryAccess = `${flightCount} of stairs`;
    }
    
    if (hasStairs && canHelp === false) {
      deliveryAccess = 'Stairs no help';
    }
    
    onSelect(deliveryAccess);
    handleReset();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E5E5FF] rounded-full mb-4">
                <Home className="w-8 h-8 text-gray-700" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Delivery Access</h2>
              <p className="text-sm text-gray-600">Question 1 of 3</p>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-6 text-center">
                Do we need to bring the mattress up or down any stairs?
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setHasStairs(true);
                    goToStep(2);
                  }}
                  className="w-full bg-white border border-gray-200 text-gray-900 p-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-left group flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">Yes</p>
                    <p className="text-sm text-gray-600">We have stairs</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => {
                    setHasStairs(false);
                    goToStep(4); // Go to lift question
                  }}
                  className="w-full bg-white border border-gray-200 text-gray-900 p-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-left group flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">No</p>
                    <p className="text-sm text-gray-600">No stairs to navigate</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => goToStep(2)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-700 p-4 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all text-left group flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">Skip for now</p>
                    <p className="text-sm text-gray-500">I&apos;ll get this info later</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </>
        );

      case 2:
        return (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FFE5F5] rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Stairs Details</h2>
              <p className="text-sm text-gray-600">Step 2 - Stairs Type</p>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-6 text-center">
                How many stairs are there?
              </h3>
              
              {hasStairs === false && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">You indicated no stairs - you can skip this or update if needed</p>
                </div>
              )}
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setStairsType('few');
                    if (!hasStairs) setHasStairs(true);
                    goToStep(3);
                  }}
                  className="w-full bg-white border border-gray-200 text-gray-900 p-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-left group flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">Just a few steps</p>
                    <p className="text-sm text-gray-600">A few steps leading up to the house</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => {
                    setStairsType('flight');
                    if (!hasStairs) setHasStairs(true);
                    goToStep(5); // Go to flight count selection
                  }}
                  className="w-full bg-white border border-gray-200 text-gray-900 p-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-left group flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">Flight(s) of stairs</p>
                    <p className="text-sm text-gray-600">One or more flights</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => goToStep(3)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-700 p-4 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all text-left group flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">Skip for now</p>
                    <p className="text-sm text-gray-500">I&apos;ll get this info later</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </>
        );

      case 3:
        return (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FFE5F5] rounded-full mb-4">
                <Users className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Important Notice</h2>
              <p className="text-sm text-gray-600">Question {stairsType === 'flight' ? '4 of 4' : '3 of 3'}</p>
            </div>

            {/* Important Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Mattresses are heavy!</p>
                  <p className="text-sm text-gray-700">
                    Our delivery driver will need your assistance to carry the mattress up the stairs. 
                    If you&apos;re unable to help, we&apos;ll need to send an additional driver for $50 extra.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-6 text-center">
                Can you help our driver carry the mattress up the stairs?
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setCanHelp(true);
                    handleComplete();
                  }}
                  className="w-full bg-[#E5FFE5] border border-green-200 text-gray-900 p-4 rounded-xl hover:bg-green-50 transition-all text-left group flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">Yes, I can help</p>
                    <p className="text-sm text-gray-600">Standard delivery</p>
                  </div>
                  <div className="text-green-600 text-xl">✓</div>
                </button>

                <button
                  onClick={() => {
                    setCanHelp(false);
                    handleComplete();
                  }}
                  className="w-full bg-red-50 border border-red-200 text-gray-900 p-4 rounded-xl hover:bg-red-100 transition-all text-left group flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">No, I need help</p>
                    <p className="text-sm text-gray-600">Additional driver required</p>
                    <p className="text-xs text-red-600 font-medium mt-1">+$50 delivery fee</p>
                  </div>
                  <DollarSign className="w-5 h-5 text-red-600" />
                </button>
              </div>

              <button
                onClick={() => setStep(2)}
                className="mt-6 text-gray-600 text-sm font-medium hover:text-gray-900 flex items-center gap-2 mx-auto transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </>
        );

      case 4:
        return (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E5E5FF] rounded-full mb-4">
                <Home className="w-8 h-8 text-gray-700" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Details</h2>
              <p className="text-sm text-gray-600">Question 2 of 2</p>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-6 text-center">
                Do you have lift access to your floor?
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setHasLift(true);
                    handleComplete();
                  }}
                  className="w-full bg-white border border-gray-200 text-gray-900 p-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-left group flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">Yes</p>
                    <p className="text-sm text-gray-600">We have lift/elevator access</p>
                  </div>
                  <div className="text-green-600 text-xl">✓</div>
                </button>

                <button
                  onClick={() => {
                    setHasLift(false);
                    handleComplete();
                  }}
                  className="w-full bg-white border border-gray-200 text-gray-900 p-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-left group flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">No</p>
                    <p className="text-sm text-gray-600">Ground floor access only</p>
                  </div>
                  <div className="text-green-600 text-xl">✓</div>
                </button>
              </div>

              <button
                onClick={() => setStep(1)}
                className="mt-6 text-gray-600 text-sm font-medium hover:text-gray-900 flex items-center gap-2 mx-auto transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </>
        );

      case 5:
        return (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FFE5F5] rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Flight Details</h2>
              <p className="text-sm text-gray-600">Question 3 of 4</p>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-6 text-center">
                How many flights of stairs?
              </h3>
              
              <div className="relative">
                <select
                  value={flightCount || ''}
                  onChange={(e) => {
                    setFlightCount(e.target.value);
                    if (e.target.value) {
                      goToStep(3); // Go to help question
                    }
                  }}
                  className="w-full bg-white text-gray-900 px-4 py-3 rounded-xl border border-gray-200 appearance-none cursor-pointer font-medium hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E5E5FF] focus:border-transparent transition-all"
                >
                  <option value="" disabled>Select number of flights</option>
                  <option value="1 flight">1 flight</option>
                  <option value="2 flights">2 flights</option>
                  <option value="3 flights">3 flights</option>
                  <option value="4+ flights">4 or more flights</option>
                </select>
                <ChevronRight className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              <button
                onClick={() => setStep(2)}
                className="mt-6 text-gray-600 text-sm font-medium hover:text-gray-900 flex items-center gap-2 mx-auto transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Step Navigator - All steps always visible and clickable */}
        <div className="flex justify-center items-center gap-2 mb-8 px-4">
          {getAllSteps().map((stepInfo, index) => {
            const isActive = step === stepInfo.id;
            
            return (
              <React.Fragment key={stepInfo.id}>
                {index > 0 && (
                  <div className="w-4 h-0.5 bg-gray-300" />
                )}
                <button
                  onClick={() => setStep(stepInfo.id)}
                  className={`
                    relative flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer
                    ${isActive ? 'bg-blue-50 ring-2 ring-blue-400' : 'hover:bg-gray-50'}
                  `}
                  title={`Go to ${stepInfo.name}`}
                >
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full transition-colors
                    ${isActive ? stepInfo.color : stepInfo.completed ? 'bg-green-200' : 'bg-gray-200'}
                  `}>
                    {stepInfo.completed && !isActive ? (
                      <span className="text-sm text-green-700 font-bold">✓</span>
                    ) : (
                      <span className={`text-sm font-medium ${isActive ? 'font-bold' : ''} text-gray-700`}>
                        {stepInfo.id}
                      </span>
                    )}
                  </div>
                  <span className={`
                    text-xs font-medium
                    ${isActive ? 'text-blue-700 font-semibold' : 'text-gray-700'}
                  `}>
                    {stepInfo.name}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {renderStep()}
        
        {/* Complete button - always visible */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleComplete}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Complete Selection
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            You can complete at any time with the information you have
          </p>
        </div>
      </div>
    </div>
  );
}
