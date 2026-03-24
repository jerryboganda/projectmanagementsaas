using FluentValidation;
using LinearPrecision.Api.Modules.Automations.Models;

namespace LinearPrecision.Api.Modules.Automations.Validators;

public sealed class CreateAutomationRuleRequestValidator : AbstractValidator<CreateAutomationRuleRequest>
{
    public CreateAutomationRuleRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Trigger).NotNull();
        RuleFor(x => x.Action).NotNull();
    }
}

public sealed class UpdateAutomationRuleRequestValidator : AbstractValidator<UpdateAutomationRuleRequest>
{
    public UpdateAutomationRuleRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Trigger).NotNull();
        RuleFor(x => x.Action).NotNull();
    }
}
