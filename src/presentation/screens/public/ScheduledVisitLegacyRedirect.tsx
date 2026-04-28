import { Navigate, useLocation, useParams } from "react-router-dom";

const ScheduledVisitLegacyRedirect = () => {
  const { qrId } = useParams<{ qrId: string }>();
  const location = useLocation();

  if (!qrId) {
    return <Navigate to="/" replace />;
  }

  return (
    <Navigate to={`/scheduled-visits/${qrId}${location.search}`} replace />
  );
};

export default ScheduledVisitLegacyRedirect;
