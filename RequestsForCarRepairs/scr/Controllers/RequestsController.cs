using Microsoft.AspNetCore.Mvc;
using RequestsForCarRepairs.API.Data;
using RequestsForCarRepairs.API.Models;
using RequestsForCarRepairs.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace RequestsForCarRepairs.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RequestsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public RequestsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllRequests()
    {
        var requests = await _context.Requests
            .Include(r => r.Client)
            .Include(r => r.Master)
            .ToListAsync();

        var requestDtos = requests.Select(r => new RequestDto
        {
            RequestID = r.RequestID,
            StartDate = r.StartDate,
            CarType = r.CarType,
            CarModel = r.CarModel,
            ProblemDescription = r.ProblemDescription,
            RequestStatus = r.RequestStatus,
            CompletionDate = r.CompletionDate,
            RepairParts = r.RepairParts,
            MasterID = r.MasterID,
            ClientID = r.ClientID
        }).ToList();

        return Ok(requestDtos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetRequestById(int id)
    {
        var request = await _context.Requests
            .Include(r => r.Client)
            .Include(r => r.Master)
            .FirstOrDefaultAsync(r => r.RequestID == id);

        if (request == null)
            return NotFound($"Заявка с ID {id} не найдена");

        var requestDto = new RequestDto
        {
            RequestID = request.RequestID,
            StartDate = request.StartDate,
            CarType = request.CarType,
            CarModel = request.CarModel,
            ProblemDescription = request.ProblemDescription,
            RequestStatus = request.RequestStatus,
            CompletionDate = request.CompletionDate,
            RepairParts = request.RepairParts,
            MasterID = request.MasterID,
            ClientID = request.ClientID
        };

        return Ok(requestDto);
    }

    [HttpGet("client/{clientId}")]
    public async Task<IActionResult> GetRequestsByClient(int clientId)
    {
        var requests = await _context.Requests
            .Include(r => r.Client)
            .Include(r => r.Master)
            .Where(r => r.ClientID == clientId)
            .ToListAsync();

        var requestDtos = requests.Select(r => new RequestDto
        {
            RequestID = r.RequestID,
            StartDate = r.StartDate,
            CarType = r.CarType,
            CarModel = r.CarModel,
            ProblemDescription = r.ProblemDescription,
            RequestStatus = r.RequestStatus,
            CompletionDate = r.CompletionDate,
            RepairParts = r.RepairParts,
            MasterID = r.MasterID,
            ClientID = r.ClientID
        }).ToList();

        return Ok(requestDtos);
    }

    [HttpGet("status/{status}")]
    public async Task<IActionResult> GetRequestsByStatus(string status)
    {
        var requests = await _context.Requests
            .Include(r => r.Client)
            .Include(r => r.Master)
            .Where(r => r.RequestStatus == status)
            .ToListAsync();

        var requestDtos = requests.Select(r => new RequestDto
        {
            RequestID = r.RequestID,
            StartDate = r.StartDate,
            CarType = r.CarType,
            CarModel = r.CarModel,
            ProblemDescription = r.ProblemDescription,
            RequestStatus = r.RequestStatus,
            CompletionDate = r.CompletionDate,
            RepairParts = r.RepairParts,
            MasterID = r.MasterID,
            ClientID = r.ClientID
        }).ToList();

        return Ok(requestDtos);
    }

    [HttpPost]
    public async Task<IActionResult> CreateRequest([FromBody] CreateRequestDto requestDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var request = new Request
        {
            StartDate = requestDto.StartDate,
            CarType = requestDto.CarType,
            CarModel = requestDto.CarModel,
            ProblemDescription = requestDto.ProblemDescription,
            RequestStatus = requestDto.RequestStatus,
            CompletionDate = requestDto.CompletionDate,
            RepairParts = requestDto.RepairParts,
            MasterID = requestDto.MasterID,
            ClientID = requestDto.ClientID
        };

        _context.Requests.Add(request);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetRequestById), new { id = request.RequestID }, request);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRequest(int id, [FromBody] UpdateRequestDto requestDto)
    {
        if (id != requestDto.RequestID)
            return BadRequest("ID в URL и теле запроса не совпадают");

        var request = await _context.Requests.FindAsync(id);
        if (request == null)
            return NotFound($"Заявка с ID {id} не найдена");

        request.StartDate = requestDto.StartDate;
        request.CarType = requestDto.CarType;
        request.CarModel = requestDto.CarModel;
        request.ProblemDescription = requestDto.ProblemDescription;
        request.RequestStatus = requestDto.RequestStatus;
        request.CompletionDate = requestDto.CompletionDate;
        request.RepairParts = requestDto.RepairParts;
        request.MasterID = requestDto.MasterID;
        request.ClientID = requestDto.ClientID;

        await _context.SaveChangesAsync();

        return Ok(request);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRequest(int id)
    {
        var request = await _context.Requests.FindAsync(id);
        if (request == null)
            return NotFound($"Заявка с ID {id} не найдена");

        _context.Requests.Remove(request);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}