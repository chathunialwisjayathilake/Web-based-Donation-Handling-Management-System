const RequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  COMPLETED: 'COMPLETED',
  PARTIAL: 'PARTIAL',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
};

const Priority = {
  ROUTINE: 'ROUTINE',
  URGENT: 'URGENT',
  CRITICAL: 'CRITICAL',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
};

module.exports = { RequestStatus, Priority };
