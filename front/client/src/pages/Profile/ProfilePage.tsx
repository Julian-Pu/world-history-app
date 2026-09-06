import ProfileHeader from './ProfileHeader';
import ProfileStats from './ProfileStats';
import StudyTimeStats from './StudyTimeStats';
import EraProgress from './EraProgress';
import ProfileAchievements from './ProfileAchievements';
import StudyCalendar from './StudyCalendar';
import ProfileMenu from './ProfileMenu';

const ProfilePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <ProfileHeader />
      <ProfileStats />
      <StudyTimeStats />
      <EraProgress />
      <ProfileAchievements />
      <StudyCalendar />
      <ProfileMenu />
    </div>
  );
};

export default ProfilePage;
