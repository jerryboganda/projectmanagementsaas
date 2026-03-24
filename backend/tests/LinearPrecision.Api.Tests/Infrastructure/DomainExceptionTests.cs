using FluentAssertions;
using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Tests.Infrastructure;

public class DomainExceptionTests
{
    [Fact]
    public void NotFoundException_should_carry_message()
    {
        var ex = new NotFoundException("Task", Guid.NewGuid());
        ex.Message.Should().Contain("Task");
    }

    [Fact]
    public void ConflictException_should_carry_message()
    {
        var ex = new ConflictException("Duplicate entry");
        ex.Message.Should().Be("Duplicate entry");
    }

    [Fact]
    public void ForbiddenException_should_carry_message()
    {
        var ex = new ForbiddenException("Access denied");
        ex.Message.Should().Be("Access denied");
    }

    [Fact]
    public void BadRequestException_should_carry_message()
    {
        var ex = new BadRequestException("Invalid input");
        ex.Message.Should().Be("Invalid input");
    }
}
