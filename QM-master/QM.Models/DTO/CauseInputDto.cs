namespace QM.Models.DTO
{
    /// <summary>
    /// Kept as a thin alias of <see cref="CauseDto"/> so existing controller
    /// signatures that referenced CauseInputDto keep compiling. New code should
    /// use CauseDto directly.
    /// </summary>
    public class CauseInputDto : CauseDto
    {
    }
}
