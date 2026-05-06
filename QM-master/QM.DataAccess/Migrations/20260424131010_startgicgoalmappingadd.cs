using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QM.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class startgicgoalmappingadd : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GoalReference",
                table: "StrategicGoals");

            migrationBuilder.CreateTable(
                name: "RequestStrategicGoalMapping",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RequestID = table.Column<int>(type: "int", nullable: true),
                    StrategicGoalID = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RequestStrategicGoalMapping", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RequestStrategicGoalMapping_RiskRequests_RequestID",
                        column: x => x.RequestID,
                        principalTable: "RiskRequests",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_RequestStrategicGoalMapping_StrategicGoals_StrategicGoalID",
                        column: x => x.StrategicGoalID,
                        principalTable: "StrategicGoals",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_RequestStrategicGoalMapping_RequestID",
                table: "RequestStrategicGoalMapping",
                column: "RequestID");

            migrationBuilder.CreateIndex(
                name: "IX_RequestStrategicGoalMapping_StrategicGoalID",
                table: "RequestStrategicGoalMapping",
                column: "StrategicGoalID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RequestStrategicGoalMapping");

            migrationBuilder.AddColumn<string>(
                name: "GoalReference",
                table: "StrategicGoals",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
