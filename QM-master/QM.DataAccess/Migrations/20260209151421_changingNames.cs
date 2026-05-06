using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QM.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class changingNames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ActionResponsibleMapping_Entities_ResponsibleId",
                table: "ActionResponsibleMapping");

            migrationBuilder.DropForeignKey(
                name: "FK_RequestEntityMappings_Entities_ResponsibleID",
                table: "RequestEntityMappings");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Responsibles",
                table: "Responsibles");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Entities",
                table: "Entities");

            migrationBuilder.RenameTable(
                name: "Responsibles",
                newName: "WorkEntity");

            migrationBuilder.RenameTable(
                name: "Entities",
                newName: "Responsible");

            migrationBuilder.AddPrimaryKey(
                name: "PK_WorkEntity",
                table: "WorkEntity",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Responsible",
                table: "Responsible",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ActionResponsibleMapping_Responsible_ResponsibleId",
                table: "ActionResponsibleMapping",
                column: "ResponsibleId",
                principalTable: "Responsible",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RequestEntityMappings_Responsible_ResponsibleID",
                table: "RequestEntityMappings",
                column: "ResponsibleID",
                principalTable: "Responsible",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ActionResponsibleMapping_Responsible_ResponsibleId",
                table: "ActionResponsibleMapping");

            migrationBuilder.DropForeignKey(
                name: "FK_RequestEntityMappings_Responsible_ResponsibleID",
                table: "RequestEntityMappings");

            migrationBuilder.DropPrimaryKey(
                name: "PK_WorkEntity",
                table: "WorkEntity");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Responsible",
                table: "Responsible");

            migrationBuilder.RenameTable(
                name: "WorkEntity",
                newName: "Responsibles");

            migrationBuilder.RenameTable(
                name: "Responsible",
                newName: "Entities");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Responsibles",
                table: "Responsibles",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Entities",
                table: "Entities",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ActionResponsibleMapping_Entities_ResponsibleId",
                table: "ActionResponsibleMapping",
                column: "ResponsibleId",
                principalTable: "Entities",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RequestEntityMappings_Entities_ResponsibleID",
                table: "RequestEntityMappings",
                column: "ResponsibleID",
                principalTable: "Entities",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
