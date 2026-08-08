import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, Lock, Phone, Mail, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, HelpCircle, X } from 'lucide-react';
import { foodService } from '../../services/foodService';
import { useFoodAuthStore } from '../../store/useFoodAuthStore';

export const FoodPartnerLogin: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useFoodAuthStore((state) => state.setAuth);

  const [mode, setMode] = useState<'otp' | 'password'>('otp');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notAppliedInfo, setNotAppliedInfo] = useState<{
    isNotApplied: boolean;
    message: string;
    steps?: string[];
  } | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setError('Please enter your mobile number or email');
      return;
    }

    setLoading(true);
    setError('');
    setNotAppliedInfo(null);

    try {
      await foodService.sendOtp(identifier);
      setOtpSent(true);
    } catch (err: any) {
      const resp = err.response?.data;
      if (resp?.notApplied) {
        setNotAppliedInfo({
          isNotApplied: true,
          message: resp.message || 'Mobile number not applied as a Food Partner.',
          steps: resp.process?.steps || [
            '1. Open the ApexBee Main Mobile App or Website.',
            '2. Navigate to "Earn with ApexBee" section.',
            '3. Select "Food Partner Application" and submit your restaurant profile and KYC details.',
            '4. Once reviewed & approved by ApexBee Admin, your mobile number will be enabled for login here.'
          ]
        });
      } else {
        setError(resp?.message || 'Failed to send OTP. Check mobile number or credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setError('Please enter email or phone');
      return;
    }

    setLoading(true);
    setError('');
    setNotAppliedInfo(null);

    try {
      const res = await foodService.login({
        email: identifier.includes('@') ? identifier : undefined,
        phone: !identifier.includes('@') ? identifier : undefined,
        password: mode === 'password' ? password : undefined,
        otp: mode === 'otp' ? otp : undefined,
      });

      if (res.data?.success) {
        const { token, user, partnerContext } = res.data;
        setAuth(token, user, partnerContext);

        if (!partnerContext.isOnboardingCompleted) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      const resp = err.response?.data;
      if (resp?.notApplied) {
        setNotAppliedInfo({
          isNotApplied: true,
          message: resp.message || 'Mobile number not applied as a Food Partner.',
          steps: resp.process?.steps || [
            '1. Open the ApexBee Main Mobile App or Website.',
            '2. Navigate to "Earn with ApexBee" section.',
            '3. Select "Food Partner Application" and submit your restaurant profile and KYC details.',
            '4. Once reviewed & approved by ApexBee Admin, your mobile number will be enabled for login here.'
          ]
        });
      } else {
        setError(resp?.message || 'Login failed. Please check your credentials or OTP.');
      }
    } finally {
      setLoading(false);
    }
  };

  const defaultApplicationSteps = [
    'Open the ApexBee Main App or visit the web platform.',
    'Go to "Earn with ApexBee" -> "Food Partner Application".',
    'Fill in your Restaurant profile, menu summary & upload business KYC documents.',
    'Submit for verification. Upon Admin approval, your account is activated for Food Partner Login.'
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex p-3 bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 rounded-2xl shadow-xl shadow-amber-500/20 mb-4">
          <Utensils className="w-8 h-8 font-bold" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-100 font-heading tracking-wide">APEXBEE FOOD</h1>
        <p className="mt-1 text-xs font-semibold text-amber-400 uppercase tracking-widest">Restaurant Partner Portal</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="glass-panel py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-800">

          {/* TAB TOGGLE */}
          <div className="flex bg-slate-900/80 p-1 rounded-xl mb-6 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('otp');
                setError('');
                setNotAppliedInfo(null);
              }}
              className={`flex-1 py-2.5 font-bold rounded-lg transition ${
                mode === 'otp' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In with Mobile (OTP)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('password');
                setError('');
                setNotAppliedInfo(null);
              }}
              className={`flex-1 py-2.5 font-bold rounded-lg transition ${
                mode === 'password' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Password Login
            </button>
          </div>

          {/* STANDARD ERROR */}
          {error && !notAppliedInfo && (
            <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium rounded-xl flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* NOT APPLIED ALERT & PROCESS STEP BOX */}
          {notAppliedInfo && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-slate-200">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm mb-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>Account Not Applied</span>
              </div>
              <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                {notAppliedInfo.message}
              </p>

              <div className="bg-slate-900/90 border border-amber-500/20 p-3.5 rounded-xl space-y-2 text-xs">
                <p className="font-semibold text-amber-400 uppercase text-[10px] tracking-wider">Application Process:</p>
                {(notAppliedInfo.steps || defaultApplicationSteps).map((step, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-snug">{step}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-slate-400 text-center">
                Need help? Contact ApexBee Support at <a href="mailto:support@apexbee.in" className="text-amber-400 underline">support@apexbee.in</a>
              </p>
            </div>
          )}

          {/* OTP FORM */}
          {mode === 'otp' && (
            <form onSubmit={otpSent ? handleLogin : handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Mobile Number / Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (notAppliedInfo) setNotAppliedInfo(null);
                    }}
                    placeholder="Enter registered mobile number"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  />
                </div>
              </div>

              {otpSent && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Enter 6-Digit Verification OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    className="w-full px-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm tracking-widest font-mono text-center focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>{otpSent ? 'Verify OTP & Sign In' : 'Send Verification OTP'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* PASSWORD FORM */}
          {mode === 'password' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Email / Mobile</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (notAppliedInfo) setNotAppliedInfo(null);
                    }}
                    placeholder="Enter registered email or mobile"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In to Food Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* APPLICATION GUIDANCE LINK */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center space-y-3">
            <button
              type="button"
              onClick={() => setShowProcessModal(true)}
              className="inline-flex items-center space-x-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Not a partner yet? How to Apply</span>
            </button>

            <p className="text-[11px] text-slate-500 flex items-center justify-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Only Pre-Applied & Approved Partners Can Access</span>
            </p>
          </div>

        </div>
      </div>

      {/* HOW TO APPLY MODAL */}
      {showProcessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 relative shadow-2xl text-slate-100">
            <button
              onClick={() => setShowProcessModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
                <Utensils className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white">Food Partner Onboarding</h3>
                <p className="text-xs text-amber-400">Application Process Guide</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Direct registration is disabled on this portal. Only restaurants and food outlets that have submitted an application and been verified by ApexBee can log in.
            </p>

            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 mb-5">
              {defaultApplicationSteps.map((step, idx) => (
                <div key={idx} className="flex items-start space-x-3 text-xs text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="mt-0.5 leading-snug">{step}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowProcessModal(false)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition"
            >
              Got It, Back to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
