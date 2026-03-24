using FluentValidation;
using LinearPrecision.Api.Modules.Tasks.Models;

namespace LinearPrecision.Api.Modules.Tasks.Validators;

public sealed class UpdateTaskRequestValidator : AbstractValidator<UpdateTaskRequest>
{
    public UpdateTaskRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MinimumLength(1).MaximumLength(500);
        RuleFor(x => x.Description).MaximumLength(50000).When(x => x.Description is not null);
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.Priority).IsInEnum();
        RuleFor(x => x.TaskType).MaximumLength(50).When(x => x.TaskType is not null);
    }
}

public sealed class UpdateTaskStatusRequestValidator : AbstractValidator<UpdateTaskStatusRequest>
{
    public UpdateTaskStatusRequestValidator()
    {
        RuleFor(x => x.Status).IsInEnum();
    }
}

public sealed class AddCommentRequestValidator : AbstractValidator<AddCommentRequest>
{
    public AddCommentRequestValidator()
    {
        RuleFor(x => x.Body).NotEmpty().MaximumLength(10000);
    }
}

public sealed class EditCommentRequestValidator : AbstractValidator<EditCommentRequest>
{
    public EditCommentRequestValidator()
    {
        RuleFor(x => x.Body).NotEmpty().MaximumLength(10000);
    }
}

public sealed class AddChecklistItemRequestValidator : AbstractValidator<AddChecklistItemRequest>
{
    public AddChecklistItemRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(500);
    }
}

public sealed class UpdateChecklistItemRequestValidator : AbstractValidator<UpdateChecklistItemRequest>
{
    public UpdateChecklistItemRequestValidator()
    {
        RuleFor(x => x.Title).MaximumLength(500).When(x => x.Title is not null);
    }
}

public sealed class AddDependencyRequestValidator : AbstractValidator<AddDependencyRequest>
{
    public AddDependencyRequestValidator()
    {
        RuleFor(x => x.DependsOnTaskId).NotEmpty();
        RuleFor(x => x.Type).IsInEnum().When(x => x.Type.HasValue);
    }
}

public sealed class AddWatcherRequestValidator : AbstractValidator<AddWatcherRequest>
{
    public AddWatcherRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
    }
}

public sealed class TaskAttachmentUploadRequestValidator : AbstractValidator<TaskAttachmentUploadRequest>
{
    public TaskAttachmentUploadRequestValidator()
    {
        RuleFor(x => x.FileName).NotEmpty().MaximumLength(260);
        RuleFor(x => x.ContentType).NotEmpty().MaximumLength(200);
        RuleFor(x => x.FileSizeBytes).GreaterThan(0);
    }
}
