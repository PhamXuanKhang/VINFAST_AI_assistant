'use client';

import { useEffect, useState } from 'react';
import { Shield, Users, Calendar, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:8000/api/admin/metrics').then(r => r.json()),
      fetch('http://localhost:8000/api/admin/appointments').then(r => r.json()),
      fetch('http://localhost:8000/api/admin/signals').then(r => r.json())
    ]).then(([metricsData, appointmentsData, signalsData]) => {
      setMetrics(metricsData.metrics);
      setAppointments(appointmentsData.appointments);
      setSignals(signalsData.signals);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-10 text-center">Loading Admin Dashboard...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-black">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center gap-4 border-b pb-4">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
        </header>

        {/* Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center gap-3 text-slate-500 mb-2">
              <Users className="w-5 h-5" />
              <h2 className="font-medium">Total Leads</h2>
            </div>
            <p className="text-3xl font-bold">{metrics?.total_leads || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center gap-3 text-slate-500 mb-2">
              <Calendar className="w-5 h-5" />
              <h2 className="font-medium">Appointments</h2>
            </div>
            <p className="text-3xl font-bold">{metrics?.total_appointments || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
             <div className="flex items-center gap-3 text-slate-500 mb-2">
              <Activity className="w-5 h-5" />
              <h2 className="font-medium">Signals Logged</h2>
            </div>
            <p className="text-3xl font-bold">{signals?.length || 0}</p>
          </div>
        </section>

        {/* Appointments Table */}
        <section className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-slate-800">Recent Appointments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-4 font-medium border-b">Customer</th>
                  <th className="p-4 font-medium border-b">Phone</th>
                  <th className="p-4 font-medium border-b">Car Model</th>
                  <th className="p-4 font-medium border-b">Datetime</th>
                  <th className="p-4 font-medium border-b">Showroom</th>
                  <th className="p-4 font-medium border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr><td colSpan={6} className="p-4 text-center text-slate-500">No appointments yet</td></tr>
                ) : appointments.map(app => (
                  <tr key={app.appointment_id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="p-4 font-medium">{app.customer_name || 'N/A'}</td>
                    <td className="p-4 text-slate-600">{app.phone}</td>
                    <td className="p-4 text-slate-600"><span className="border border-slate-200 rounded px-2 py-1 inline-block bg-slate-100">{app.car_model}</span></td>
                    <td className="p-4 text-slate-600">{app.appointment_datetime}</td>
                    <td className="p-4 text-slate-600">{app.showroom_name}</td>
                    <td className="p-4">
                      <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Signals Log */}
        <section className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-slate-800">Telemetry Signals</h2>
            <p className="text-sm text-slate-500">Events like feedback, handoff, and corrections.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-4 font-medium border-b">Timestamp</th>
                  <th className="p-4 font-medium border-b">Event Type</th>
                  <th className="p-4 font-medium border-b">Details</th>
                </tr>
              </thead>
              <tbody>
                {signals.length === 0 ? (
                  <tr><td colSpan={3} className="p-4 text-center text-slate-500">No signals logged today</td></tr>
                ) : signals.map((sig, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="p-4 text-slate-600">{new Date(sig.timestamp).toLocaleString()}</td>
                    <td className="p-4 font-medium">
                       <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">{sig.event}</span>
                    </td>
                    <td className="p-4 text-slate-600">
                      <pre className="text-xs bg-slate-50 p-2 rounded border whitespace-pre-wrap">{JSON.stringify(sig.data, null, 2)}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
