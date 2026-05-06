using Microsoft.VisualStudio.TestTools.UnitTesting;
using Microsoft.EntityFrameworkCore;
using QM.DataAccess.Data;
using QM.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace QM.DataAccess.Tests
{
    [TestClass]
    public class UnitTest
    {
        

        private static ApplicationDbContext CreateInMemoryContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            return new ApplicationDbContext(options);
        }

        [TestMethod]
        public void Test1()
        {


            Assert.AreEqual(1, 1);
        }



    }
}

