using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QM.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class changeCategoryNameToString2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Risks_Categories_CategoryId",
                table: "Risks");

            migrationBuilder.DropIndex(
                name: "IX_Risks_CategoryId",
                table: "Risks");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "Risks");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CategoryId",
                table: "Risks",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Risks_CategoryId",
                table: "Risks",
                column: "CategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_Risks_Categories_CategoryId",
                table: "Risks",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id");
        }
    }
}
