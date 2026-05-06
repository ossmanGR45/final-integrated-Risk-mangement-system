using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace QM.Models
{
    public class Enums
    {
        public enum ActionType
        {
            Avoidance = 0,
            Reduction = 1
        } 

        public enum RequestStatus
        {
            Rejected = 0,
            InProgress = 1,
            underReview = 2,
            Accepted = 3,
        }

        public enum Likelihood
        {
            veryLow = 1,
            low = 2,
            Medium = 3,
            High = 4,
            Critical = 5
        }

        public enum Impact
        {
            veryLow = 1,
            low = 2,
            Medium = 3,
            High = 4,
            Critical = 5
        }

        public enum requestType
        {
            Risk = 0,
            Incident = 1
        }

        public enum notificationType
        {
            reject = 0,
            accept = 1,
            updated = 2,
            created = 3
        }
    }
}
