using feedme.Server.Models;
using feedme.Server.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace feedme.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReceiptsController : ControllerBase
{
    private readonly IReceiptRepository _repository;

    public ReceiptsController(IReceiptRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Receipt>>> Get()
    {
        var receipts = await _repository.GetAllAsync();
        return Ok(receipts);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Receipt>> GetById(string id)
    {
        var receipt = await _repository.GetByIdAsync(id);
        return receipt is null ? NotFound() : Ok(receipt);
    }

    [HttpPost]
    public async Task<ActionResult<Receipt>> Create([FromBody] Receipt receipt)
    {
        try
        {
            var created = await _repository.AddAsync(receipt);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (ArgumentException ex)
        {
            var modelState = new ModelStateDictionary();
            var key = string.IsNullOrWhiteSpace(ex.ParamName) ? string.Empty : ex.ParamName!;
            modelState.AddModelError(key, ex.Message);

            return ValidationProblem(modelState);
        }
    }
}
