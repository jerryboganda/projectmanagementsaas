using FluentAssertions;
using LinearPrecision.Api.Modules.Tasks.Models;
using LinearPrecision.Api.Modules.Tasks.Validators;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Tests.Modules.Tasks;

public class CreateTaskRequestValidatorTests
{
    private readonly CreateTaskRequestValidator _validator = new();

    [Fact]
    public void Valid_request_should_pass()
    {
        var request = new CreateTaskRequest(
            ProjectId: Guid.NewGuid(),
            Title: "Implement feature X",
            Description: null,
            Status: null,
            Priority: null,
            TaskType: null,
            Labels: null,
            AssigneeId: null,
            ParentTaskId: null,
            SprintId: null,
            StartDate: null,
            DueDate: null,
            EstimatePoints: null,
            EstimateHours: null,
            CustomFields: null);

        var result = _validator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Empty_project_id_should_fail()
    {
        var request = new CreateTaskRequest(
            ProjectId: Guid.Empty,
            Title: "Valid Title",
            Description: null,
            Status: null,
            Priority: null,
            TaskType: null,
            Labels: null,
            AssigneeId: null,
            ParentTaskId: null,
            SprintId: null,
            StartDate: null,
            DueDate: null,
            EstimatePoints: null,
            EstimateHours: null,
            CustomFields: null);

        var result = _validator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "ProjectId");
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Empty_or_null_title_should_fail(string? title)
    {
        var request = new CreateTaskRequest(
            ProjectId: Guid.NewGuid(),
            Title: title!,
            Description: null,
            Status: null,
            Priority: null,
            TaskType: null,
            Labels: null,
            AssigneeId: null,
            ParentTaskId: null,
            SprintId: null,
            StartDate: null,
            DueDate: null,
            EstimatePoints: null,
            EstimateHours: null,
            CustomFields: null);

        var result = _validator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Title");
    }

    [Fact]
    public void Title_exceeding_500_chars_should_fail()
    {
        var request = new CreateTaskRequest(
            ProjectId: Guid.NewGuid(),
            Title: new string('X', 501),
            Description: null,
            Status: null,
            Priority: null,
            TaskType: null,
            Labels: null,
            AssigneeId: null,
            ParentTaskId: null,
            SprintId: null,
            StartDate: null,
            DueDate: null,
            EstimatePoints: null,
            EstimateHours: null,
            CustomFields: null);

        var result = _validator.Validate(request);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Valid_status_enum_should_pass()
    {
        var request = new CreateTaskRequest(
            ProjectId: Guid.NewGuid(),
            Title: "Task with status",
            Description: null,
            Status: TaskItemStatus.InProgress,
            Priority: TaskPriority.High,
            TaskType: null,
            Labels: null,
            AssigneeId: null,
            ParentTaskId: null,
            SprintId: null,
            StartDate: null,
            DueDate: null,
            EstimatePoints: null,
            EstimateHours: null,
            CustomFields: null);

        var result = _validator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Description_at_limit_should_pass()
    {
        var request = new CreateTaskRequest(
            ProjectId: Guid.NewGuid(),
            Title: "Task",
            Description: new string('A', 50000),
            Status: null,
            Priority: null,
            TaskType: null,
            Labels: null,
            AssigneeId: null,
            ParentTaskId: null,
            SprintId: null,
            StartDate: null,
            DueDate: null,
            EstimatePoints: null,
            EstimateHours: null,
            CustomFields: null);

        var result = _validator.Validate(request);
        result.IsValid.Should().BeTrue();
    }
}
