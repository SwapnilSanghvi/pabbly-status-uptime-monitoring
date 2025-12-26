import { formatDistanceToNow } from 'date-fns';
import {
  formatTimestampWithTZ,
  formatFullTimestamp,
  getTimezoneAbbreviation,
} from '../../utils/timezone';
import { useTimezone } from '../../contexts/TimezoneContext';

export default function Timestamp({
  timestamp,
  format = 'hybrid', // 'hybrid', 'relative', 'full'
  showTimezone = true,
  className = '',
}) {
  const { timezone } = useTimezone();

  if (!timestamp) {
    return <span className={className}>Never</span>;
  }

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return <span className={className}>Invalid date</span>;
  }

  const tzAbbr = getTimezoneAbbreviation(timezone, date);

  const getDisplayText = () => {
    switch (format) {
      case 'relative':
        return formatDistanceToNow(date, { addSuffix: true });

      case 'full': {
        const fullDateTime = date.toLocaleString('en-US', {
          timeZone: timezone,
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });
        return showTimezone ? `${fullDateTime} ${tzAbbr}` : fullDateTime;
      }

      case 'hybrid':
      default:
        return formatTimestampWithTZ(timestamp, {
          showRelative: true,
          showExact: true,
          showTimezone,
          timezone,
        });
    }
  };

  // Full datetime for tooltip
  const tooltipText = formatFullTimestamp(timestamp, timezone);

  return (
    <span className={className} title={tooltipText}>
      {getDisplayText()}
    </span>
  );
}
