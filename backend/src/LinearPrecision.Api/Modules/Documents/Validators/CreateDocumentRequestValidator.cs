using FluentValidation;
using LinearPrecision.Api.Modules.Documents.Models;

namespace LinearPrecision.Api.Modules.Documents.Validators;

public sealed class CreateDocumentRequestValidator : AbstractValidator<CreateDocumentRequest>
{
    public CreateDocumentRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Content).MaximumLength(500_000).When(x => x.Content is not null);
        RuleFor(x => x.ContentFormat).MaximumLength(50).When(x => x.ContentFormat is not null);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0).When(x => x.SortOrder.HasValue);
    }
}

public sealed class UpdateDocumentRequestValidator : AbstractValidator<UpdateDocumentRequest>
{
    public UpdateDocumentRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Content).MaximumLength(500_000).When(x => x.Content is not null);
        RuleFor(x => x.ContentFormat).MaximumLength(50).When(x => x.ContentFormat is not null);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0).When(x => x.SortOrder.HasValue);
    }
}
