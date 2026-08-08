using System;
using CaptionBackend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CaptionBackend.Migrations;

[DbContext(typeof(CaptionDbContext))]
[Migration("20260620123000_InitialCreate")]
public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Sessions",
            columns: table => new
            {
                SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                StartTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                EndTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Sessions", x => x.SessionId);
            });

        migrationBuilder.CreateTable(
            name: "Captions",
            columns: table => new
            {
                CaptionId = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                Timestamp = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                Language = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                Text = table.Column<string>(type: "text", nullable: false),
                Confidence = table.Column<double>(type: "double precision", nullable: true),
                SpeakerId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Captions", x => x.CaptionId);
                table.ForeignKey(
                    name: "FK_Captions_Sessions_SessionId",
                    column: x => x.SessionId,
                    principalTable: "Sessions",
                    principalColumn: "SessionId",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Captions_SessionId_Timestamp",
            table: "Captions",
            columns: new[] { "SessionId", "Timestamp" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "Captions");

        migrationBuilder.DropTable(
            name: "Sessions");
    }
}
