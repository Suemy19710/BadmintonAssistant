import React, {useMemo} from 'react';
import {
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    Cell
} from 'recharts';

import {THEMES} from '../constants/Setup';
import { ThemeModes } from '../constants/types';
import {mockDb} from '../services/mockBackend';
const ProgressDashboard = ({theme}) => {
    const currentTheme = THEMES[theme];
    const user = mockDb.getCurrentUser();
// use hool useMemo helps to memoizes values 
    const matches = useMemo(() => {
        if (!user) return [];
        return mockDb.getMatches(user.userId).slice(0,7).reverse();
    }, [user]);

    const chartData = useMemo(() => {
    return matches.map(m => ({
      name: new Date(m.dateTime).toLocaleDateString(undefined, { weekday: 'short' }),
      smash: m.scores.smash,
      footwork: m.scores.footwork,
      net: m.scores.netPlay
    }));
  }, [matches]);

    const skillDistribution = useMemo(() => {
         if (matches.length === 0) return [];
        const latest = matches[matches.length - 1].scores;
        return [
        { name: 'Smash', value: latest.smash },
        { name: 'Clear', value: latest.clear },
        { name: 'Drop', value: latest.dropShot },
        { name: 'Net', value: latest.netPlay },
        { name: 'Footwork', value: latest.footwork },
        ];
    }, [matches]);

    if (matches.length === 0) {
        return (
              <div className={`${currentTheme.card} p-8 rounded-2xl text-center border ${currentTheme.accent}`}>
                <p className={currentTheme.subtext}>
                No training data yet. Complete your first session to see stats!
                </p>
            </div>
        );
    }
 return (
    <div className="space-y-6">
      <div className={`${currentTheme.card} p-6 rounded-2xl shadow-sm border ${currentTheme.accent}`}>
        <h3 className={`text-lg font-bold mb-4 ${currentTheme.text}`}>Session Performance</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={theme === 'dark-green' ? '#1e293b' : '#f1f5f9'}
              />
             <XAxis
                dataKey="name"
                interval={0}         
                minTickGap={0}
                stroke={theme === 'dark-green' ? '#64748b' : '#94a3b8'}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark-green' ? '#0f172a' : '#fff',
                  borderColor: theme === 'dark-green' ? '#10b981' : '#4f46e5',
                  borderRadius: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="smash"
                stroke="#10b981"
                strokeWidth={3}
                dot={true}
              />
              <Line
                type="monotone"
                dataKey="footwork"
                stroke="#4f46e5"
                strokeWidth={3}
                dot={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`${currentTheme.card} p-6 rounded-2xl shadow-sm border ${currentTheme.accent}`}>
        <h3 className={`text-lg font-bold mb-4 ${currentTheme.text}`}>Latest Mastery</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={skillDistribution} layout="vertical">
              <XAxis type="number" hide domain={[0, 100]} />
              <YAxis
                dataKey="name"
                type="category"
                stroke={theme === 'dark-green' ? '#64748b' : '#94a3b8'}
                fontSize={12}
                width={70}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip cursor={{ fill: 'transparent' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {skillDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={theme === 'dark-green' ? '#10b981' : '#4f46e5'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;







