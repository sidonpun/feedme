using feedme.Server.Models;
using feedme.Server.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace feedme.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CatalogController : ControllerBase
{
    private readonly ICatalogRepository _repository;

    public CatalogController(ICatalogRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public ActionResult<IEnumerable<CatalogItem>> Get()
        => Ok(_repository.GetAll());

    [HttpGet("{id}")]
    public ActionResult<CatalogItem> GetById(string id)
    {
        var item = _repository.GetById(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public ActionResult<CatalogItem> Create([FromBody] CatalogItem item)
    {
        var created = _repository.Add(item);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }
}
