import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

// Mock data for demonstration — replace with real API data in production
const activityData = [
  { name: 'Mon', chats: 12, documents: 3, projects: 1 },
  { name: 'Tue', chats: 19, documents: 5, projects: 2 },
  { name: 'Wed', chats: 8, documents: 2, projects: 0 },
  { name: 'Thu', chats: 24, documents: 8, projects: 3 },
  { name: 'Fri', chats: 31, documents: 11, projects: 1 },
  { name: 'Sat', chats: 15, documents: 4, projects: 0 },
  { name: 'Sun', chats: 9, documents: 2, projects: 0 },
]

const customTooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#f1f5f9',
  fontSize: '12px',
}

export function ActivityBarChart() {
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-800 p-5">
      <h3 className="mb-4 text-sm font-semibold text-white">Weekly Activity</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={activityData} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
          <Bar dataKey="chats" name="Chats" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="documents" name="Documents" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="projects" name="Projects" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TokenUsageChart() {
  const tokenData = activityData.map((d) => ({ ...d, tokens: d.chats * 450 + d.documents * 1200 }))

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-800 p-5">
      <h3 className="mb-4 text-sm font-semibold text-white">Token Usage</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={tokenData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={customTooltipStyle} />
          <Line
            type="monotone"
            dataKey="tokens"
            name="Tokens"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
