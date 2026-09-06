import HomeWelcome from './HomeWelcome';
import HomeRecommended from './HomeRecommended';
import HomeDailyQuiz from './HomeDailyQuiz';
import HomeOverview from './HomeOverview';
import HomeEraProgress from './HomeEraProgress';
import HomeQuickLinks from './HomeQuickLinks';
import HomeRecent from './HomeRecent';

const HomePage: React.FC = () => {
  return (
    <div className="space-y-6 md:space-y-8">
      {/* 顶部欢迎区 */}
      <HomeWelcome />

      {/* 今日推荐 */}
      <HomeRecommended />

      {/* 每日一练 + 学习概览 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HomeDailyQuiz />
        <HomeOverview />
      </div>

      {/* 时期进度 + 快捷入口 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HomeEraProgress />
        <HomeQuickLinks />
      </div>

      {/* 最近学习 */}
      <HomeRecent />
    </div>
  );
};

export default HomePage;
