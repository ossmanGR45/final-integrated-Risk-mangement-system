using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QM.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class removeActionResponsibleMappingNDconnectRiskToResponsible : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActionResponsibleMapping");

            migrationBuilder.AddColumn<int>(
                name: "ResponsibleId",
                table: "Risks",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Risks_ResponsibleId",
                table: "Risks",
                column: "ResponsibleId");

            migrationBuilder.AddForeignKey(
                name: "FK_Risks_Responsible_ResponsibleId",
                table: "Risks",
                column: "ResponsibleId",
                principalTable: "Responsible",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Risks_Responsible_ResponsibleId",
                table: "Risks");

            migrationBuilder.DropIndex(
                name: "IX_Risks_ResponsibleId",
                table: "Risks");

            migrationBuilder.DropColumn(
                name: "ResponsibleId",
                table: "Risks");

            migrationBuilder.CreateTable(
                name: "ActionResponsibleMapping",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ActionId = table.Column<int>(type: "int", nullable: false),
                    ResponsibleId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActionResponsibleMapping", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActionResponsibleMapping_Actions_ActionId",
                        column: x => x.ActionId,
                        principalTable: "Actions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ActionResponsibleMapping_Responsible_ResponsibleId",
                        column: x => x.ResponsibleId,
                        principalTable: "Responsible",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActionResponsibleMapping_ActionId",
                table: "ActionResponsibleMapping",
                column: "ActionId");

            migrationBuilder.CreateIndex(
                name: "IX_ActionResponsibleMapping_ResponsibleId",
                table: "ActionResponsibleMapping",
                column: "ResponsibleId");
        }
    }
}
