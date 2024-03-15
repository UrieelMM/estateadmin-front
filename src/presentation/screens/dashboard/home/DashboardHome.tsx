import ChartHome from '../../../components/shared/ChartHome'
import DirectAccess from '../../../components/shared/DirectAccess'
import StatsHome from '../../../components/shared/StatsHome'
import UsersListAdmin from '../../../components/shared/UsersListAdmin'

const DashboardHome = () => {
  return (
    <div>
      <StatsHome />
      <div className="flex flex-col-reverse xl:flex-row justify-between items-start mt-12 mb-12">
        <DirectAccess />
        <UsersListAdmin />
      </div>
      <ChartHome />        
    </div>
  )
}

export default DashboardHome