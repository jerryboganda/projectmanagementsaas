using FluentValidation;
using LinearPrecision.Api.Modules.Workspace.Models;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Modules.Workspace.Validators;

public sealed class InviteMemberRequestValidator : AbstractValidator<InviteMemberRequest>
{
    public InviteMemberRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(254);

        RuleFor(x => x.Role)
            .IsInEnum()
            .Must(role => role != MembershipRole.Owner)
            .WithMessage("Cannot invite a member with the Owner role.");
    }
}
