type User = {
  id?: string;
  username?: string;
  email?: string | null;
  password?: string | null;
  club?: string | null;
  createdAt?: Date;
  updatedAt?: Date | null;
  role?: string;
  // Add other user properties as needed
};

type UserProfileSidebarProps = {
  user?: User | null;
};

export function UserProfileSidebar({ user }: UserProfileSidebarProps) {
  // Mock data for demonstration - replace with real data later
  const profileData = {
    name: user?.username || "Eivind Melleby",
    avatar: "/images/profile-avatar.jpg", // Replace with actual avatar
    following: 16,
    followers: 32,
    activities: 1243,
    latestActivity: {
      title: "Morning Sailing Session",
      date: "Today at 08:30",
      type: "Sailing"
    },
    weekStats: {
      sessions: "2 økter",
      time: "4t 48m",
      distance: "12.5 nm"
    },
    yearStats: {
      sessions: "112 økter",
      time: "234t 48m",
      distance: "1,250 nm"
    },
    weeklyActivity: [
      { day: 'M', time: 0 },
      { day: 'T', time: 165 }, // 2:45 in minutes
      { day: 'W', time: 0 },
      { day: 'T', time: 0 },
      { day: 'F', time: 120 }, // 2:00 in minutes
      { day: 'S', time: 0 },
      { day: 'S', time: 0 }
    ]
  };

  if (!user) {
    return (
      <div className="w-full bg-white rounded-xl border shadow-sm p-6">
        <div className="text-center text-gray-500">
          Please log in to view your profile
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* Profile Header */}
      <div className="p-6 pb-4">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 mb-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg">
            {profileData.name.split(' ').map(n => n[0]).join('')}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{profileData.name}</h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-center">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Following</div>
            <div className="text-lg font-bold text-gray-900">{profileData.following}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Followers</div>
            <div className="text-lg font-bold text-gray-900">{profileData.followers}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Activities</div>
            <div className="text-lg font-bold text-gray-900">{profileData.activities}</div>
          </div>
        </div>

        {/* Latest Activity */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Latest Activity</div>
          <div className="font-semibold text-gray-900">{profileData.latestActivity.title}</div>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
            {profileData.latestActivity.date}
          </div>
        </div>
      </div>

      {/* Training Log Button */}
      <div className="px-6 pb-4">
        <button className="w-full flex justify-between items-center p-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
          <span className="font-medium text-gray-700">Training Log</span>
          <span className="text-gray-400">→</span>
        </button>
      </div>

      {/* This Week Stats */}
      <div className="px-6 pb-4">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          THIS WEEK
          <div className="flex-1 border-b border-gray-200"></div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Sessions</span>
            <span className="font-semibold text-gray-900">{profileData.weekStats.sessions}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Time</span>
            <span className="font-semibold text-gray-900">{profileData.weekStats.time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Distance</span>
            <span className="font-semibold text-gray-900">{profileData.weekStats.distance}</span>
          </div>
        </div>

        {/* Week Activity Bar Chart */}
        <div className="flex justify-center gap-2">
          {profileData.weeklyActivity.map((day, index) => {
            const maxTime = Math.max(...profileData.weeklyActivity.map(d => d.time));
            const heightPercentage = maxTime > 0 ? (day.time / maxTime) * 100 : 0;
            const formatTime = (minutes: number) => {
              if (minutes === 0) return '';
              const hours = Math.floor(minutes / 60);
              const mins = minutes % 60;
              return `${hours}:${mins.toString().padStart(2, '0')}`;
            };

            return (
              <div key={index} className="flex flex-col items-center">
                {/* Time label */}
                <div className="text-xs font-medium text-gray-700 mb-1 h-4">
                  {formatTime(day.time)}
                </div>
                {/* Bar */}
                <div className="relative w-8 h-24 bg-gray-100 rounded-sm overflow-hidden">
                  {day.time > 0 && (
                    <div
                      className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-sm transition-all duration-300"
                      style={{ height: `${Math.max(heightPercentage, 8)}%` }}
                    />
                  )}
                </div>
                {/* Day label */}
                <div className="text-xs text-gray-500 mt-1">{day.day}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* This Year Stats */}
      <div className="px-6 pb-4">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          THIS YEAR
          <div className="flex-1 border-b border-gray-200"></div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Sessions</span>
            <span className="font-semibold text-gray-900">{profileData.yearStats.sessions}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Time</span>
            <span className="font-semibold text-gray-900">{profileData.yearStats.time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Distance</span>
            <span className="font-semibold text-gray-900">{profileData.yearStats.distance}</span>
          </div>
        </div>
      </div>

      {/* Manage Goals Button */}
      <div className="px-6 pb-6">
        <button className="w-full flex justify-between items-center p-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
          <span className="font-medium text-gray-700">Manage Your Goals</span>
          <span className="text-gray-400">→</span>
        </button>
      </div>
    </div>
  );
}
