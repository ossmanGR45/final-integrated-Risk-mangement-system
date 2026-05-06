using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace QM.Utility
{
    public static class Extention 
    {

        public static List<string> ToStringList(this string data)
        {
            return data.TrimEnd(',').Split(',').ToList();
        }
    }
}
