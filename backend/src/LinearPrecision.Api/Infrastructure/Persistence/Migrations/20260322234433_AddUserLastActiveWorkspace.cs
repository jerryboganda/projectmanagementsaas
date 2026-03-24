using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LinearPrecision.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserLastActiveWorkspace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "last_active_workspace_id",
                table: "AspNetUsers",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "last_active_workspace_id",
                table: "AspNetUsers");
        }
    }
}
